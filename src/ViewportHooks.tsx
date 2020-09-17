//based on https://blog.logrocket.com/developing-responsive-layouts-with-react-hooks/

import React from "react";

interface ViewportProviderProps {
  children: React.ReactNode
}

const viewportContext = React.createContext<{ width: number; height: number }>({
  width: 0,
  height: 0
});

export const ViewportProvider = ( props: ViewportProviderProps ) => {
  const {children} = props;

  const [width, setWidth] = React.useState(window.innerWidth);
  const [height, setHeight] = React.useState(window.innerHeight);
  const handleWindowResize = () => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  };

  React.useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  return (
    <viewportContext.Provider value={{ width, height }}>
      {children}
    </viewportContext.Provider>
  );
};

export const useViewport = () => {
  const { width, height } = React.useContext(viewportContext);
  return { width, height };
};
