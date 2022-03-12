import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { useCallback, useMemo } from 'react';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import { formatDate } from '../../utils/format';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const estimatedTimeToRead = useMemo(() => {
    const regex = /[\s,.\n\t\r?$]/;

    const totalWords = post.data.content.reduce((acc, el) => {
      const splitedHeading = el.heading.split(regex);

      const splitedBody = RichText.asText(el.body)
        .split(regex)
        .filter(value => !!value);

      return acc + splitedHeading.length + splitedBody.length;
    }, 0);

    return Math.round(totalWords / 200);
  }, [post.data.content]);

  return (
    <main>
      <Head>
        <title>{post.data.title} | Spacetravelling</title>
      </Head>

      <div className={commonStyles.wrapper}>
        <Header />
      </div>

      {router.isFallback ? (
        <section className={commonStyles.wrapper}>
          <p className={styles.loading}>Carregando...</p>
        </section>
      ) : (
        <article>
          <img
            src={post.data.banner.url}
            alt="banner"
            className={styles.banner}
          />

          <section className={`${styles.article} ${commonStyles.wrapper}`}>
            <h1 className={styles.title}>{post.data.title}</h1>

            <div className={commonStyles.detailsGroup}>
              <span className={commonStyles.detail}>
                <FiCalendar className={commonStyles.icon} />
                {formatDate(post.first_publication_date)}
              </span>

              <span className={commonStyles.detail}>
                <FiUser className={commonStyles.icon} />
                {post.data.author}
              </span>

              <span className={commonStyles.detail}>
                <FiClock className={commonStyles.icon} />
                {estimatedTimeToRead} min
              </span>
            </div>

            {post.data.content.map(content => (
              <section key={content.heading} className={styles.section}>
                <h2 className={styles.subtitle}>{content.heading}</h2>

                <div
                  className={styles.body}
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </section>
            ))}
          </section>
        </article>
      )}
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const slugs = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths: slugs,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const post = await prismic.getByUID('posts', slug as string);

  return {
    props: {
      post,
    },
    revalidate: 60 * 5,
  };
};
