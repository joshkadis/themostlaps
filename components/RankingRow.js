import PropTypes from 'prop-types';
import classNames from 'classnames';
import Link from 'next/link';
import { locale } from '../config';
import * as styles from './Layout.css';
import AthleteHeader from './lib/AthleteHeader';

const RankingRow = ({
  athleteId,
  rank,
  firstname,
  lastname,
  img,
  value,
  unit,
}) => (
  <tr className="big">
    <td className={classNames(
      { biggest: rank === 1, bigger: rank !== 1 },
      { [styles['ranking-row__first']]: rank === 1 },
    )}>
      {rank}
    </td>
    <td>
      <Link href={`/rider?athleteId=${athleteId}`} as={`/rider/${athleteId}`}>
        <a>
          <AthleteHeader
            img={img}
            firstname={firstname}
            lastname={lastname}
          />
        </a>
      </Link>
    </td>
    <td>{value.toLocaleString(locale)} {unit}{value === 1 ? '' : 's'}</td>
  </tr>
);

RankingRow.defaultProps = {
  unit: 'lap',
};

RankingRow.propTypes = {
  athleteId: PropTypes.number.isRequired,
  rank: PropTypes.number.isRequired,
  firstname: PropTypes.string.isRequired,
  lastname: PropTypes.string.isRequired,
  img: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  unit: PropTypes.string,
};

export default RankingRow;
