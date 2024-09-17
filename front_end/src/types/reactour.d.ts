declare module 'reactour' {
    import { ReactNode } from 'react';
  
    interface Step {
      selector?: string;
      content: ReactNode;
      position?: 'top' | 'right' | 'bottom' | 'left' | 'center';
      action?: (node: HTMLElement) => void;
      style?: object;
      stepInteraction?: boolean;
    }
  
    interface TourProps {
      steps: Step[];
      isOpen: boolean;
      onRequestClose: () => void;
      startAt?: number;
      scrollDuration?: number;
      inViewThreshold?: number;
      disableInteraction?: boolean;
      disableKeyboardNavigation?: boolean | string[];
      className?: string;
      closeWithMask?: boolean;
      onAfterOpen?: (target: HTMLElement) => void;
      onBeforeClose?: (target: HTMLElement) => void;
      maskClassName?: string;
      maskSpace?: number;
      updateDelay?: number;
      children?: ReactNode;
      showNumber?: boolean;
      accentColor?: string;
      highlightedMaskClassName?: string;
      lastStepNextButton?: ReactNode;
    }
  
    const Tour: React.FC<TourProps>;
  
    export default Tour;
  }