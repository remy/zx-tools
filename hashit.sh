echo "export default { prev: \"$CACHED_COMMIT_REF\", curr: \"$COMMIT_REF\", timestamp: \"$(date +'%s')\" }" > public/hash.js
