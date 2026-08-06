import { useEffect } from 'react';

type PageMetaProps = {
  htmlLang: string;
  title: string;
  description: string;
};

export function PageMeta({ htmlLang, title, description }: PageMetaProps) {
  useEffect(() => {
    document.documentElement.lang = htmlLang;
    document.title = title;

    const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (metaDescription) {
      metaDescription.content = description;
    }
  }, [description, htmlLang, title]);

  return null;
}
