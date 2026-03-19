const { emitOrderUpdate } = require('./src/socket/handlers/orderHandler');

const mockIO = {
  to: (room) => {
    console.log(`MOCK IO: to(${room})`);
    return {
      emit: (event, data) => {
        console.log(`MOCK IO: emit(${event}) to room ${room}`);
      },
    };
  },
};

const orderId = '69960e8449fb2699ceab339f';

console.log('--- STARTING MANUAL NOTIFICATION TEST ---');
emitOrderUpdate(mockIO, orderId)
  .then(() => {
    console.log('--- MANUAL TEST FINISHED SUCCESSFULLY ---');
    process.exit(0);
  })
  .catch((err) => {
    console.error('--- MANUAL TEST FAILED ---');
    console.error(err);
    process.exit(1);
  });
