import { useState } from 'react';
import './login.css';
import { DEMO_ACCOUNTS, setUser, type DemoAccount } from '../store/appAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError('');

    // TODO: POST /api/auth/login { email, password }
    //       → response: { name, email, role, avatar? }
    const matched = DEMO_ACCOUNTS.find(
      a => a.email === email && a.password === password
    );

    if (!matched) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      return;
    }

    const { password: _password, ...user } = matched;
    void _password;
    setUser(user);
    window.location.href = '/';
  };

  const fillAccount = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>로그인</h1>
          <p>서비스를 이용하려면 로그인하세요</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn">로그인</button>
        </form>

        <div className="login-footer">
          <span>계정이 없으신가요?</span>
          <a href="#">회원가입</a>
        </div>

        <div className="login-test-hint">
          <p>테스트 계정 (클릭하면 자동 입력)</p>
          {DEMO_ACCOUNTS.map(account => (
            <button
              key={account.role}
              type="button"
              className="test-account-btn"
              onClick={() => fillAccount(account)}
            >
              <span className={`test-role-badge test-role-badge--${account.role.toLowerCase().replace('role_', '')}`}>
                {account.role}
              </span>
              <span className="test-account-info">
                <span>{account.email}</span>
                <span>{account.password}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
