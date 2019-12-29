/**
 * Reset stats for an athlete by removing some activities
 *
 * @param {Athlete} athleteDoc Athlete document
 * @param {Array} activityDocs Activity documents
 */
// async function resetStatsFromActivities(athleteDoc, activityDocs) {
//   const removeStats = activityDocs.reduce(
//     (acc, { laps }) => {
//       if (!laps) {
//         return acc;
//       }
//       acc.allTime = acc.allTime || 0;
//       acc.allTime += laps;
//
//       acc.single
//     },
//     {}
//   );
// }

/**
 * Subtract a single activity from a stats object for v1 stats schema
 *
 * @param {Object} stats
 * @param {Activity} activity Activity doc
 * @return {Object} Updated stats
 */
function subtractActivityFromStatsV1(stats, { laps }) {

}

module.exports = {
  // resetStatsFromActivities,
};
