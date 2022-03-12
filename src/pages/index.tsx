import { GetStaticProps } from 'next';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { useState } from 'react';
import Header from '../components/Header';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { formatDate } from '../utils/format';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const { results, next_page } = postsPagination;
  const [nextPage, setNextPage] = useState<string>(next_page);
  const [posts, setPosts] = useState<Post[]>(results);

  const handleLoadMore = () => {
    fetch(next_page)
      .then(res => res.json())
      .then((data: PostPagination) => {
        setNextPage(data.next_page);
        setPosts([...posts, ...data.results]);
      });
  };

  return (
    <main className={commonStyles.wrapper}>
      <Header />

      <ul className={styles.postList}>
        {posts.length > 0 &&
          posts.map(post => (
            <li key={post.uid}>
              <Link href={`/post/${post.uid}`} passHref>
                <a>
                  <article className={styles.post}>
                    <h2 className={styles.title}>{post.data.title}</h2>
                    <p className={styles.description}>{post.data.subtitle}</p>
                    <div className={commonStyles.detailsGroup}>
                      <span className={commonStyles.detail}>
                        <FiCalendar className={commonStyles.icon} />
                        {formatDate(post.first_publication_date)}
                      </span>

                      <span className={commonStyles.detail}>
                        <FiUser className={commonStyles.icon} />
                        {post.data.author}
                      </span>
                    </div>
                  </article>
                </a>
              </Link>
            </li>
          ))}
      </ul>

      {!!nextPage && (
        <button
          type="button"
          className={styles.loadMore}
          onClick={handleLoadMore}
        >
          Carregar mais posts
        </button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
    }
  );

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results ?? [],
  };

  return {
    props: {
      postsPagination,
    },
    revalidate: 60 * 5,
  };
};
