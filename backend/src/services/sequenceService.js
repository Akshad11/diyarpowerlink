export async function getNextSequenceNumber(prefix, Model, fieldName) {
  const latest = await Model.findOne({}, {}, { sort: { [fieldName]: -1 } });
  let nextSeq = 1;
  if (latest && latest[fieldName]) {
    const match = latest[fieldName].match(/\d+$/);
    if (match) {
      nextSeq = parseInt(match[0], 10) + 1;
    }
  }
  return `${prefix}-${String(nextSeq).padStart(4, '0')}`;
}
