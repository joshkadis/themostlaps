import React from 'react';
import Link from 'next/link';

export default () => (
  <div
    style={{ textAlign: 'center' }}
  >
    <h4>
      🇮🇹 Check out the <Link
        href="/ranking?type=special&filter=giro2018"
        as="/ranking/giro2018"
      >
        <a>Giro di Laps</a>
      </Link>! 🇮🇹
    </h4>
  </div>
);