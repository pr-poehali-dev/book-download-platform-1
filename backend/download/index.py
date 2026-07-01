import json
import re
import base64
import zipfile
import io
import html
import os
import time
import uuid

import requests
from bs4 import BeautifulSoup

import boto3


HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
        '(KHTML, like Gecko) Chrome/120.0 Safari/537.36'
    ),
    'Accept-Language': 'en-US,en;q=0.9',
}

MAX_FREE_CHAPTERS = 30


def _clean(text: str) -> str:
    text = html.unescape(text or '')
    text = re.sub(r'\s+\n', '\n', text)
    return text.strip()


def extract_book_id(url: str):
    m = re.search(r'/book/[^/]*?(\d{8,})', url)
    if m:
        return m.group(1)
    m = re.search(r'(\d{10,})', url)
    return m.group(1) if m else None


def fetch_catalog(book_id: str, session: requests.Session):
    api = f'https://www.webnovel.com/go/pcm/chapter/get-chapter-list?_csrfToken=&bookId={book_id}'
    r = session.get(api, headers=HEADERS, timeout=20)
    if r.status_code != 200:
        return None
    try:
        data = r.json()
    except Exception:
        return None
    volumes = (data.get('data') or {}).get('volumeItems') or []
    chapters = []
    for vol in volumes:
        for ch in vol.get('chapterItems', []):
            if ch.get('isVip', 0) == 0 and ch.get('isAuth', 1) in (1, 0):
                chapters.append({
                    'id': str(ch.get('chapterId')),
                    'name': ch.get('chapterName', 'Chapter'),
                    'vip': ch.get('isVip', 0),
                })
    return {
        'title': (data.get('data') or {}).get('bookInfo', {}).get('bookName', 'WebNovel Book'),
        'chapters': chapters,
    }


def fetch_chapter(book_id: str, chapter_id: str, session: requests.Session):
    api = (
        'https://www.webnovel.com/go/pcm/chapter/getContent'
        f'?_csrfToken=&bookId={book_id}&chapterId={chapter_id}'
    )
    r = session.get(api, headers=HEADERS, timeout=20)
    try:
        data = r.json()
    except Exception:
        return None
    info = (data.get('data') or {}).get('chapterInfo') or {}
    if info.get('isVip', 0) == 1:
        return None
    name = info.get('chapterName', 'Chapter')
    contents = info.get('contents') or []
    paras = [_clean(c.get('content', '')) for c in contents if c.get('content')]
    if not paras and info.get('content'):
        soup = BeautifulSoup(info['content'], 'html.parser')
        paras = [_clean(p.get_text()) for p in soup.find_all('p')]
    return {'name': name, 'paras': [p for p in paras if p]}


def build_epub(title: str, chapters: list) -> bytes:
    buf = io.BytesIO()
    zf = zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED)

    zf.writestr('mimetype', 'application/epub+zip')
    zf.writestr('META-INF/container.xml',
        '<?xml version="1.0"?>\n'
        '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
        '<rootfiles><rootfile full-path="OEBPS/content.opf" '
        'media-type="application/oebps-package+xml"/></rootfiles></container>')

    manifest, spine, nav_points = [], [], []
    for i, ch in enumerate(chapters):
        fn = f'chap_{i}.xhtml'
        safe_title = html.escape(ch['name'])
        body = ''.join(f'<p>{html.escape(p)}</p>' for p in ch['paras'])
        doc = (
            '<?xml version="1.0" encoding="utf-8"?>\n'
            '<!DOCTYPE html>\n'
            '<html xmlns="http://www.w3.org/1999/xhtml"><head>'
            f'<title>{safe_title}</title></head><body>'
            f'<h2>{safe_title}</h2>{body}</body></html>'
        )
        zf.writestr(f'OEBPS/{fn}', doc)
        manifest.append(f'<item id="c{i}" href="{fn}" media-type="application/xhtml+xml"/>')
        spine.append(f'<itemref idref="c{i}"/>')
        nav_points.append(
            f'<navPoint id="n{i}" playOrder="{i+1}"><navLabel><text>{safe_title}</text>'
            f'</navLabel><content src="{fn}"/></navPoint>')

    book_uid = str(uuid.uuid4())
    opf = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="bid">'
        '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
        f'<dc:title>{html.escape(title)}</dc:title>'
        '<dc:language>en</dc:language>'
        f'<dc:identifier id="bid">urn:uuid:{book_uid}</dc:identifier>'
        '<dc:source>webnovel.com</dc:source></metadata>'
        '<manifest>'
        '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'
        + ''.join(manifest) +
        '</manifest><spine toc="ncx">' + ''.join(spine) + '</spine></package>'
    )
    zf.writestr('OEBPS/content.opf', opf)

    ncx = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">'
        f'<head><meta name="dtb:uid" content="urn:uuid:{book_uid}"/></head>'
        f'<docTitle><text>{html.escape(title)}</text></docTitle>'
        '<navMap>' + ''.join(nav_points) + '</navMap></ncx>'
    )
    zf.writestr('OEBPS/toc.ncx', ncx)
    zf.close()
    return buf.getvalue()


def upload_epub(data: bytes, title: str) -> str:
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    safe = re.sub(r'[^a-zA-Z0-9]+', '-', title).strip('-')[:40] or 'book'
    key = f'epub/{safe}-{int(time.time())}.epub'
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType='application/epub+zip')
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def handler(event: dict, context) -> dict:
    '''Скачивает бесплатные главы книги с WebNovel по ссылке и собирает EPUB-файл'''
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Method not allowed'})}

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        body = {}
    url = (body.get('url') or '').strip()

    if not url or 'webnovel.com' not in url:
        return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Укажите корректную ссылку на книгу с webnovel.com'}, ensure_ascii=False)}

    book_id = extract_book_id(url)
    if not book_id:
        return {'statusCode': 400, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Не удалось определить книгу из ссылки'}, ensure_ascii=False)}

    session = requests.Session()
    catalog = fetch_catalog(book_id, session)
    if not catalog or not catalog['chapters']:
        return {'statusCode': 404, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Бесплатные главы не найдены или книга недоступна'}, ensure_ascii=False)}

    free_chapters = catalog['chapters'][:MAX_FREE_CHAPTERS]
    collected = []
    for ch in free_chapters:
        content = fetch_chapter(book_id, ch['id'], session)
        if content and content['paras']:
            collected.append(content)
        time.sleep(0.15)

    if not collected:
        return {'statusCode': 404, 'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Не удалось загрузить содержимое бесплатных глав'}, ensure_ascii=False)}

    epub_bytes = build_epub(catalog['title'], collected)
    file_url = upload_epub(epub_bytes, catalog['title'])

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({
            'title': catalog['title'],
            'chapters': len(collected),
            'total_free': len(catalog['chapters']),
            'fileUrl': file_url,
        }, ensure_ascii=False),
    }
