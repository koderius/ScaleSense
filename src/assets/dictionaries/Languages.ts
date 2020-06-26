export type Language = {
  code: string,
  title: string,
  name: string,
  dir: 'ltr' | 'rtl',
}

export const Languages: Language[] = [
  {
    code: 'iw',
    title: 'עברית',
    name: 'hebrew',
    dir: 'rtl',
  },
  {
    code: 'en',
    title: 'English',
    name: 'english',
    dir: 'ltr',
  }
];
