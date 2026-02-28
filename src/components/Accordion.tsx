'use client';

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { ChevronDown } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface AccordionContextValue {
  openItem: string | null;
  toggle: (value: string) => void;
  collapsible: boolean;
}

const AccordionContext = createContext<AccordionContextValue>({
  openItem: null,
  toggle: () => {},
  collapsible: true,
});

/* ------------------------------------------------------------------ */
/*  Accordion (root)                                                   */
/* ------------------------------------------------------------------ */

interface AccordionProps {
  type?: 'single';
  collapsible?: boolean;
  className?: string;
  children: ReactNode;
}

export function Accordion({
  collapsible = false,
  className,
  children,
}: AccordionProps) {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggle = useCallback(
    (value: string) => {
      setOpenItem((prev) => {
        if (prev === value) return collapsible ? null : prev;
        return value;
      });
    },
    [collapsible],
  );

  return (
    <AccordionContext.Provider value={{ openItem, toggle, collapsible }}>
      <div className={className} data-state={openItem ? 'open' : 'closed'}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  AccordionItem                                                      */
/* ------------------------------------------------------------------ */

interface ItemContextValue {
  value: string;
  isOpen: boolean;
}

const ItemContext = createContext<ItemContextValue>({
  value: '',
  isOpen: false,
});

interface AccordionItemProps {
  value: string;
  className?: string;
  children: ReactNode;
}

export function AccordionItem({ value, className, children }: AccordionItemProps) {
  const { openItem } = useContext(AccordionContext);
  const isOpen = openItem === value;

  return (
    <ItemContext.Provider value={{ value, isOpen }}>
      <div
        className={className}
        data-state={isOpen ? 'open' : 'closed'}
      >
        {children}
      </div>
    </ItemContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  AccordionTrigger                                                   */
/* ------------------------------------------------------------------ */

interface AccordionTriggerProps {
  className?: string;
  children: ReactNode;
}

export function AccordionTrigger({ className, children }: AccordionTriggerProps) {
  const { toggle } = useContext(AccordionContext);
  const { value, isOpen } = useContext(ItemContext);

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      className={className}
      data-state={isOpen ? 'open' : 'closed'}
      onClick={() => toggle(value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {children}
      <ChevronDown
        size={14}
        style={{
          transition: 'transform 200ms ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          flexShrink: 0,
        }}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  AccordionContent                                                   */
/* ------------------------------------------------------------------ */

interface AccordionContentProps {
  className?: string;
  children: ReactNode;
}

export function AccordionContent({ className, children }: AccordionContentProps) {
  const { isOpen } = useContext(ItemContext);
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Skip animation on first render
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (isOpen) {
      setHeight(el.scrollHeight);
    } else {
      // When closing, first set explicit height so transition works
      setHeight(el.scrollHeight);
      // Force reflow, then set to 0
      requestAnimationFrame(() => {
        setHeight(0);
      });
    }
  }, [isOpen]);

  // After open transition ends, switch to auto height so content can resize
  const handleTransitionEnd = () => {
    if (isOpen) {
      setHeight(undefined);
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      data-state={isOpen ? 'open' : 'closed'}
      style={{
        overflow: 'hidden',
        height: !mounted
          ? isOpen
            ? 'auto'
            : 0
          : height === undefined
            ? 'auto'
            : height,
        transition: mounted ? 'height 200ms ease' : 'none',
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      {children}
    </div>
  );
}
