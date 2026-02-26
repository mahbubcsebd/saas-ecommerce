function log(msg) {
    process.stdout.write(msg + '\n');
}

log('TRACE: START');
try {
    log('TRACE: Requiring asyncHandler');
    // Is it in utils or middlewares?
    // I saw it in both earlier in list_dir
    const ah = require('../utils/asyncHandler');
    log('TRACE: asyncHandler loaded from utils');

    log('TRACE: Requiring response');
    require('../utils/response');

    log('TRACE: Requiring prisma');
    require('../config/prisma');

    log('TRACE: Requiring socket');
    require('../socket');

    log('TRACE: SUCCESS');
} catch (e) {
    log('TRACE: FAILED');
    log('Message: ' + e.message);
    log('Stack: ' + e.stack);
}
