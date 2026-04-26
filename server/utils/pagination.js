/**
 * Paginiert eine Mongoose-Query dynamisch
 * @param {mongoose.Model} model - Das Mongoose-Model
 * @param {number|string} pageQuery - Gewünschte Seite (aus req.query.page)
 * @param {number|string} limitQuery - Gewünschtes Limit (aus req.query.limit)
 * @param {object} filter - Query-Filter
 * @param {object} options - Zusätzliche Find-Optionen
 */
export async function paginate (model, pageQuery = 1, limitQuery = 10, filter = {}, options = {}) {
  // 1. Seite und Limit berechnen (Fallback auf 10)
  const page = Math.max(parseInt(pageQuery, 10) || 1, 1);
  const limit = Math.max(parseInt(limitQuery, 10) || 10, 1); // Standard 10, Minimum 1

  const skip = (page - 1) * limit;

  // Basis-Query aufbauen
  let query = model.find(filter);

  // Optionen anwenden
  if (options.sort) query = query.sort(options.sort);
  if (options.populate) query = query.populate(options.populate);
  if (options.select) query = query.select(options.select);

  // Pagination anwenden mit dem dynamischen Limit
  query = query.skip(skip).limit(limit);

  // Parallele Ausführung
  const [items, totalItems] = await Promise.all([
    query.exec(),
    model.countDocuments(filter)
  ]);

  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);

  return {
    items,
    currentPage: page,
    totalPages,
    totalItems
  };
}
