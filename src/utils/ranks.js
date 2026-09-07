// Shared League of Legends rank/LP helpers used by LP graph axis labels

export function getTierDivisionFromTotalLp(totalLp) {
  if (totalLp >= 2800) return `Master ${totalLp - 2800}LP`;
  if (totalLp >= 2400) {
    const div = ['IV', 'III', 'II', 'I'][Math.min(3, Math.floor((totalLp - 2400) / 100))];
    return `Dia ${div}`;
  }
  if (totalLp >= 2000) {
    const div = ['IV', 'III', 'II', 'I'][Math.min(3, Math.floor((totalLp - 2000) / 100))];
    return `Eme ${div}`;
  }
  if (totalLp >= 1600) {
    const div = ['IV', 'III', 'II', 'I'][Math.min(3, Math.floor((totalLp - 1600) / 100))];
    return `Plat ${div}`;
  }
  if (totalLp >= 1200) {
    const div = ['IV', 'III', 'II', 'I'][Math.min(3, Math.floor((totalLp - 1200) / 100))];
    return `Gold ${div}`;
  }
  return `Silv ${totalLp}LP`;
}
