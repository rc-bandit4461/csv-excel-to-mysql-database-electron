
exports.verifyJson = function verifyJson(json) {
    if (json.host === undefined) return false;
    if (json.user === undefined) return false;
    if (json.password === undefined) return false;
    if (json.database === undefined) return false;
    if (json.tablename === undefined) return false;
    return true;
};