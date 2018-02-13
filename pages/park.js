import fetch from 'isomorphic-unfetch';
import Link from 'next/link';
import Layout from '../components/Layout';
import { getEnvOrigin } from '../utils/envUtils';

const Park = ({ allTime }) => (
  <Layout>
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
  if (!context.query.segment || isNaN(context.query.segment)) {
    return { allTime: [] };
  }

  const response = await fetch(`${getEnvOrigin()}/api/ranking/allTime/${context.query.segment}`);
  const ranking = await response.json();

  return {
    allTime: !ranking.error ? ranking.ranking : [],
  };
}

export default Park;
