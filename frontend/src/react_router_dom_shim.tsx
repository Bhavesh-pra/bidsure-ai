import React, { createContext, useContext, useState, useEffect } from 'react';

const RouterContext = createContext<{ pathname: string; navigate: (path: string) => void }>({
  pathname: window.location.pathname || '/dashboard',
  navigate: () => {},
});

export const BrowserRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pathname, setPathname] = useState(window.location.pathname || '/dashboard');

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || '/dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setPathname(path);
  };

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useLocation = () => {
  const { pathname } = useContext(RouterContext);
  return { pathname };
};

export const useNavigate = () => {
  const { navigate } = useContext(RouterContext);
  return navigate;
};

export const Link: React.FC<{ to: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ to, children, style }) => {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
      style={{ cursor: 'pointer', ...style }}
    >
      {children}
    </a>
  );
};

export const useParams = <T extends Record<string, string>>(): T => {
  const { pathname } = useLocation();
  const parts = pathname.split('/');
  return { id: parts[parts.length - 1] || 'BID-001' } as any;
};

export interface RouteProps {
  path: string;
  element: React.ReactElement;
}

export const Route: React.FC<RouteProps> = ({ element }) => element;

export const Routes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  let matchedElement: React.ReactElement | null = null;

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const { path, element } = child.props as RouteProps;
    if (!path) return;

    if (path === pathname) {
      matchedElement = element;
    } else if (path.includes(':id')) {
      const prefix = path.split('/:id')[0];
      if (pathname.startsWith(prefix) && (pathname.length === prefix.length || pathname[prefix.length] === '/')) {
        matchedElement = element;
      }
    }
  });

  return matchedElement || (children as any)[0]?.props?.element || null;
};
