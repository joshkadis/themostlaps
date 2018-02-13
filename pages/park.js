import fetch from 'isomorphic-unfetch';
import Link from 'next/link';
import Layout from '../components/Layout';
import { getEnvOrigin } from '../utils/envUtils';

const Park = ({ allTime, query, url }) => (
  <Layout
    url={url}
    query={query}
  >
    <h1>All Time Ranking</h1>
    {allTime.map(({ _id, athlete, stats }) => (
      <p key={_id}>{`${athlete.firstname} ${athlete.lastname}: ${stats.allTime} laps`}</p>
    ))}
    <Link href="/">
      <a>Home</a>
    </Link>
  </Layout>
);

Park.getInitialProps = async function(context) {
  const { url, query } = context;

  let allTime = []
  if (query.segment && !isNaN(query.segment)) {
    const response = await fetch(`${getEnvOrigin()}/api/ranking/allTime/${query.segment}`);
    const ranking = await response.json();
    allTime = !ranking.error ? ranking.ranking : [];
  }

  return {
    allTime,
    query,
    url,
  };
}

export default Park;
