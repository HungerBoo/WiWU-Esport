// Shared date formatting and age calculation helpers used across pages/components

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
}

export function calculateAge(birthDate, fallbackText = 'Alter unbekannt') {
  if (!birthDate) return fallbackText;

  const [year, month, day] = birthDate.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const birthdayHasPassed = today.getMonth() + 1 > month
    || (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!birthdayHasPassed) age -= 1;

  return `${age} Jahre`;
}
