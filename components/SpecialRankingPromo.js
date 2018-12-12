import React from 'react';
import Link from 'next/link';

export default () => (
  <div
    style={{ textAlign: 'center' }}
  >
    <h4>
      Check out the new ranking...
      <br />
      ❄️ <Link
        href="/ranking?type=special&filter=cold2019"
        as="/ranking/cold2019"
      >
        <a>Cold Laps</a>
      </Link>! ❄️
    </h4>
  </div>
);
