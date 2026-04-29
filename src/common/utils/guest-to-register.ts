// import { hashPassword } from './hash.util';

// // After guest completes order
// async function convertGuestToUser(orderId: string, password: string) {
//   const order = await prisma.order.findUnique({
//     where: { id: orderId },
//   });

//   if (order.userId) {
//     throw new Error('Already a registered user');
//   }

//   // Create user account
//   const user = await prisma.user.create({
//     data: {
//       email: order.guestEmail,
//       password: await hashPassword(password),
//       firstName: order.guestName.split(' ')[0],
//       lastName: order.guestName.split(' ')[1] || '',
//       role: 'CUSTOMER',
//     },
//   });

//   // Link order to user
//   await prisma.order.update({
//     where: { id: orderId },
//     data: {
//       userId: user.id,
//       guestEmail: null, // Clear guest data
//       guestPhone: null,
//       guestName: null,
//     },
//   });

//   return user;
// }
