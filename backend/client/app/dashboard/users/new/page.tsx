import UserPage from '../[userId]/page';

export default function NewUserPage() {
  return <UserPage params={Promise.resolve({ userId: 'new' })} />;
}
