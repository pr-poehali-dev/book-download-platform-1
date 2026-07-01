import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const COVERS = {
  fantasy: 'https://cdn.poehali.dev/projects/a2bf18d3-4321-413a-a2df-ff2b1ab319ac/files/efb885ff-19be-4d80-aaaf-99de1e88d84e.jpg',
  romance: 'https://cdn.poehali.dev/projects/a2bf18d3-4321-413a-a2df-ff2b1ab319ac/files/82454ead-66e0-4819-af39-1ba7a52283b6.jpg',
  scifi: 'https://cdn.poehali.dev/projects/a2bf18d3-4321-413a-a2df-ff2b1ab319ac/files/9e345e08-a42e-4c09-8aff-a6fb7120fa38.jpg',
};

const GENRES = ['Все', 'Фэнтези', 'Романтика', 'Sci-Fi', 'Боевик', 'Культивация', 'Мистика'];

const DOWNLOAD_URL = 'https://functions.poehali.dev/64f8597e-031c-4566-80d8-897a2a159940';

interface DownloadResult {
  title: string;
  chapters: number;
  total_free: number;
  fileUrl: string;
}

interface Book {
  id: number;
  title: string;
  author: string;
  cover: string;
  genre: string;
  rating: number;
  chapters: number;
  downloads: string;
  status: string;
}

const BOOKS: Book[] = [
  { id: 1, title: 'Восхождение к Небесам', author: 'Лин Чэнь', cover: COVERS.fantasy, genre: 'Культивация', rating: 4.9, chapters: 1240, downloads: '128k', status: 'Онгоинг' },
  { id: 2, title: 'Свет её магии', author: 'Айрис Вэй', cover: COVERS.romance, genre: 'Романтика', rating: 4.8, chapters: 680, downloads: '96k', status: 'Завершён' },
  { id: 3, title: 'Неоновый горизонт', author: 'Кай Ронин', cover: COVERS.scifi, genre: 'Sci-Fi', rating: 4.7, chapters: 512, downloads: '74k', status: 'Онгоинг' },
  { id: 4, title: 'Меч бессмертного', author: 'Хань Ю', cover: COVERS.fantasy, genre: 'Фэнтези', rating: 4.9, chapters: 2100, downloads: '210k', status: 'Онгоинг' },
  { id: 5, title: 'Тайна лунного двора', author: 'Мэй Лань', cover: COVERS.romance, genre: 'Мистика', rating: 4.6, chapters: 430, downloads: '58k', status: 'Завершён' },
  { id: 6, title: 'Протокол Феникс', author: 'Дэн Рей', cover: COVERS.scifi, genre: 'Боевик', rating: 4.8, chapters: 890, downloads: '112k', status: 'Онгоинг' },
];

const Index = () => {
  const [genre, setGenre] = useState('Все');
  const [query, setQuery] = useState('');
  const [liked, setLiked] = useState<number[]>([]);

  const [dlUrl, setDlUrl] = useState('');
  const [dlLoading, setDlLoading] = useState(false);
  const [dlError, setDlError] = useState('');
  const [dlResult, setDlResult] = useState<DownloadResult | null>(null);

  const handleDownload = async () => {
    setDlError('');
    setDlResult(null);
    if (!dlUrl.includes('webnovel.com')) {
      setDlError('Вставьте ссылку на книгу с webnovel.com');
      return;
    }
    setDlLoading(true);
    try {
      const res = await fetch(DOWNLOAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: dlUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDlError(data.error || 'Не удалось скачать книгу');
      } else {
        setDlResult(data);
      }
    } catch {
      setDlError('Ошибка соединения. Попробуйте ещё раз');
    } finally {
      setDlLoading(false);
    }
  };

  const filtered = BOOKS.filter(
    (b) =>
      (genre === 'Все' || b.genre === genre) &&
      (b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.author.toLowerCase().includes(query.toLowerCase())),
  );

  const toggleLike = (id: number) =>
    setLiked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary book-glow">
              <Icon name="BookOpen" size={20} className="text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">NovelHub</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#download" className="transition-colors hover:text-primary">Скачать</a>
            <a href="#catalog" className="transition-colors hover:text-primary">Каталог</a>
            <a href="#recommend" className="transition-colors hover:text-primary">Рекомендации</a>
            <a href="#about" className="transition-colors hover:text-primary">О проекте</a>
            <a href="#contact" className="transition-colors hover:text-primary">Контакты</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Icon name="Heart" size={18} />
            </Button>
            <Button variant="secondary" className="gap-2 rounded-full">
              <Icon name="User" size={16} />
              <span className="hidden sm:inline">Кабинет</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${COVERS.fantasy})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="container relative py-20 md:py-28">
          <div className="max-w-2xl fade-up">
            <Badge className="mb-4 gap-1.5 rounded-full bg-primary/15 text-primary hover:bg-primary/20">
              <Icon name="Sparkles" size={12} />
              Более 50 000 веб-новелл
            </Badge>
            <h1 className="font-display text-4xl font-extrabold leading-tight md:text-6xl">
              Читай и скачивай
              <span className="text-primary"> любимые новеллы</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Фэнтези, романтика, sci-fi и культивация. Тысячи глав в удобном формате —
              совершенно бесплатно.
            </p>
            <div className="mt-8 flex max-w-lg items-center gap-2 rounded-full border border-border bg-card p-1.5 book-glow">
              <Icon name="Search" size={20} className="ml-3 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Название книги или автор..."
                className="border-0 bg-transparent focus-visible:ring-0"
              />
              <Button className="rounded-full px-6">Найти</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Download by link */}
      <section id="download" className="container -mt-8 relative z-10">
        <div className="fade-up rounded-3xl border border-primary/30 bg-card p-6 book-glow md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
              <Icon name="Link2" size={22} className="text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold md:text-2xl">Скачать книгу по ссылке</h2>
              <p className="text-sm text-muted-foreground">Вставьте ссылку на книгу с WebNovel — соберём EPUB из бесплатных глав</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Input
              value={dlUrl}
              onChange={(e) => setDlUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !dlLoading && handleDownload()}
              placeholder="https://www.webnovel.com/book/..."
              className="h-12 rounded-xl bg-background text-base"
            />
            <Button
              onClick={handleDownload}
              disabled={dlLoading}
              className="h-12 gap-2 rounded-xl px-8 text-base"
            >
              {dlLoading ? (
                <><Icon name="Loader2" size={18} className="animate-spin" />Собираем...</>
              ) : (
                <><Icon name="Download" size={18} />Скачать</>
              )}
            </Button>
          </div>

          {dlError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/15 px-4 py-3 text-sm text-destructive">
              <Icon name="TriangleAlert" size={16} />
              {dlError}
            </div>
          )}

          {dlResult && (
            <div className="fade-up mt-4 flex flex-col items-start gap-4 rounded-xl border border-primary/30 bg-primary/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Icon name="BookCheck" size={28} className="text-primary" />
                <div>
                  <p className="font-display text-lg font-bold">{dlResult.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Готово {dlResult.chapters} бесплатных глав из {dlResult.total_free} · формат EPUB
                  </p>
                </div>
              </div>
              <a href={dlResult.fileUrl} download>
                <Button className="gap-2 rounded-full px-6">
                  <Icon name="FileDown" size={16} />
                  Скачать EPUB
                </Button>
              </a>
            </div>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            <Icon name="Info" size={12} className="mr-1 inline" />
            Скачиваются только публично доступные бесплатные главы. Уважайте авторские права.
          </p>
        </div>
      </section>

      {/* Recommendations */}
      <section id="recommend" className="container py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Рекомендации для вас</h2>
            <p className="mt-1 text-sm text-muted-foreground">Подобрано на основе вашей истории чтения</p>
          </div>
          <Icon name="Wand2" size={24} className="text-primary" />
        </div>
        <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
          {BOOKS.slice(0, 6).map((b) => (
            <div key={b.id} className="group w-40 flex-shrink-0">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                <img src={b.cover} alt={b.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-xs">
                  <Icon name="Star" size={11} className="text-primary" />
                  {b.rating}
                </div>
              </div>
              <p className="mt-2 truncate text-sm font-medium">{b.title}</p>
              <p className="truncate text-xs text-muted-foreground">{b.author}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="container py-10">
        <h2 className="font-display text-2xl font-bold md:text-3xl">Каталог книг</h2>
        <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-2">
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`flex-shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                genre === g
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b, i) => (
            <article
              key={b.id}
              className="fade-up group flex gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:book-glow"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="relative aspect-[3/4] w-28 flex-shrink-0 overflow-hidden rounded-lg">
                <img src={b.cover} alt={b.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary" className="rounded-full text-[10px]">{b.genre}</Badge>
                  <button onClick={() => toggleLike(b.id)}>
                    <Icon
                      name="Heart"
                      size={18}
                      className={liked.includes(b.id) ? 'fill-primary text-primary' : 'text-muted-foreground'}
                    />
                  </button>
                </div>
                <h3 className="mt-2 line-clamp-2 font-display text-lg font-bold leading-snug">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.author}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Icon name="Star" size={12} className="text-primary" />{b.rating}</span>
                  <span className="flex items-center gap-1"><Icon name="FileText" size={12} />{b.chapters}</span>
                  <span className="flex items-center gap-1"><Icon name="Download" size={12} />{b.downloads}</span>
                </div>
                <div className="mt-auto flex items-center gap-2 pt-3">
                  <Button size="sm" className="flex-1 gap-1.5 rounded-full">
                    <Icon name="Download" size={14} />
                    Скачать
                  </Button>
                  <Button size="sm" variant="secondary" className="rounded-full">
                    <Icon name="BookOpen" size={14} />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <Icon name="SearchX" size={40} className="mx-auto mb-3 opacity-50" />
            Ничего не найдено
          </div>
        )}
      </section>

      {/* About */}
      <section id="about" className="container py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: 'Download', title: 'Бесплатно', text: 'Скачивайте книги без ограничений и подписок' },
            { icon: 'Sparkles', title: 'Умные рекомендации', text: 'Подборки на основе вашей истории чтения' },
            { icon: 'Bookmark', title: 'Личная библиотека', text: 'Сохраняйте понравившиеся и следите за новинками' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                <Icon name={f.icon} size={22} className="text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact / Footer */}
      <footer id="contact" className="border-t border-border">
        <div className="container grid gap-10 py-14 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Icon name="BookOpen" size={20} className="text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">NovelHub</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Библиотека веб-новелл для настоящих читателей. Материалы предоставлены в
              ознакомительных целях.
            </p>
            <div className="mt-5 flex gap-3">
              {['Send', 'Twitter', 'Github'].map((s) => (
                <a key={s} href="#" className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:border-primary hover:text-primary">
                  <Icon name={s} size={18} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold">Обратная связь</h3>
            <div className="mt-4 flex flex-col gap-3">
              <Input placeholder="Ваш email" className="rounded-xl bg-card" />
              <textarea
                placeholder="Сообщение..."
                rows={3}
                className="rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <Button className="gap-2 self-start rounded-full px-6">
                <Icon name="Send" size={16} />
                Отправить
              </Button>
            </div>
          </div>
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          © 2026 NovelHub · Все права на произведения принадлежат их авторам
        </div>
      </footer>
    </div>
  );
};

export default Index;