export const generateSangjoContractNumber = (isUrgent: boolean, now = new Date()) => {
  const prefix = isUrgent ? 'URG' : 'REQ';
  const year = now.getFullYear();
  const randomPart = Math.floor(Math.random() * 900000 + 100000);
  return `${prefix}-${year}-${randomPart}`;
};
