import Link from 'next/link';
import { lapSegmentId } from '../config';

export default () => (
  <nav>
    <Link as="/prospectpark" href={`/park?segment=${lapSegmentId}`}>
      <a>Prospect Park</a>
    </Link>
  </nav>
);