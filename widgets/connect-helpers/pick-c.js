import C from './c.js';

export default function pickC(...fields) {
  for (const field of fields) {
    if (field.lastIndexOf('.') !== 0) {
      throw new Error(`Unsupported field ${field}`);
    }
  }
  const fieldNames = fields.map((field) => field.slice(1));
  return C(fields, (...values) =>
    Object.fromEntries(fieldNames.map((name, i) => [name, values[i]]))
  );
}
