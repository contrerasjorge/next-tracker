import { ApolloClient } from 'apollo-client';
import { ApolloProvider } from '@apollo/react-hooks';
import Head from 'next/head';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import fetch from 'node-fetch';
// import ApolloClient from 'apollo-boost';
// import fetch from 'isomorphic-unfetch';

export function withApollo(PageComponent) {
  const withApollo = ({ apolloClient, apolloState, ...pageProps }) => {
    const client = apolloClient || initApolloClient(apolloState);

    return (
      <ApolloProvider client={client}>
        <PageComponent {...pageProps} />
      </ApolloProvider>
    );
  };

  withApollo.getInitialProps = async ctx => {
    const { AppTree } = ctx;
    const apolloClient = (ctx.apolloClient = initApolloClient());

    let pageProps = {};
    if (PageComponent.getInitialProps) {
      pageProps = await PageComponent.getInitialProps(ctx);
    }

    if (typeof window === 'undefined') {
      // if on server
      if (ctx.res && ctx.res.finished) {
        return pageProps;
      }

      try {
        const { getDataFromTree } = await import('@apollo/react-ssr');
        await getDataFromTree(
          <AppTree
            pageProps={{
              ...pageProps,
              apolloClient
            }}
          />
        );
      } catch (e) {
        console.error(e);
      }

      Head.rewind();
    }

    const apolloState = apolloClient.cache.extract();
    return {
      ...pageProps,
      apolloState
    };
  };

  return withApollo;
}

const initApolloClient = (initialState = {}) => {
  const cache = new InMemoryCache();
  const link = new HttpLink({
    uri: `http://localhost:3000/api/graphql`,
    fetch
  });
  const ssrMode = typeof window === 'undefined';

  const client = new ApolloClient({
    ssrMode,
    link,
    cache
  });

  return client;
};

// const initApolloClient = (initialState = {}) => {
//   const ssrMode = typeof window === 'undefined';
//   const cache = new InMemoryCache().restore(initialState);

//   const client = new ApolloClient({
//     ssrMode,
//     uri: 'http://localhost:3000/api/graphql',
//     fetch,
//     cache
//   });
//   return client;
// };
