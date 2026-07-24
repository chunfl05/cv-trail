import LoginForm from './LoginForm';

export default function LoginPage() {
  const showDevLogin = process.env.ALLOW_DEV_LOGIN === 'true';
  return <LoginForm showDevLogin={showDevLogin} />;
}
