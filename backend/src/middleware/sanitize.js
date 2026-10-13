// Removes keys that start with "$" or contain "." from user input, so a body
// such as {"email": {"$ne": null}} can never reach a MongoDB query as an
// operator (NoSQL injection). Controllers still validate types on top of this.
function clean(value, depth = 0) {
	if (depth > 10 || value === null || typeof value !== 'object') return value;
	if (Array.isArray(value)) {
		value.forEach((v, i) => { value[i] = clean(v, depth + 1); });
		return value;
	}
	for (const key of Object.keys(value)) {
		if (key.startsWith('$') || key.includes('.')) {
			delete value[key];
		} else {
			value[key] = clean(value[key], depth + 1);
		}
	}
	return value;
}

export function sanitizeInput(req, _res, next) {
	if (req.body) clean(req.body);
	if (req.query) clean(req.query);
	if (req.params) clean(req.params);
	next();
}
