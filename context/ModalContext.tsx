
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  showModal: (content: ReactNode) => void;
  hideModal: () => void;
  modalContent: ReactNode | null;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);

  const showModal = (content: ReactNode) => {
    setModalContent(content);
  };

  const hideModal = () => {
    setModalContent(null);
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal, modalContent }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
