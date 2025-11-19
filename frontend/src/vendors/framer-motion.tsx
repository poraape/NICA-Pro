import React, { useCallback, useEffect, useMemo, useRef } from "react";

type MotionStyle = React.CSSProperties;

type MotionProps<Tag extends keyof JSX.IntrinsicElements> = JSX.IntrinsicElements[Tag] & {
  initial?: MotionStyle;
  animate?: MotionStyle;
  transition?: {
    duration?: number;
    ease?: string;
  };
};

function useMergeRefs<T>(...refs: Array<React.Ref<T>>) {
  return useCallback(
    (node: T) => {
      refs.forEach((ref) => {
        if (!ref) return;
        if (typeof ref === "function") {
          ref(node);
        } else {
          (ref as React.MutableRefObject<T | null>).current = node;
        }
      });
    },
    [refs]
  );
}

function createMotionComponent<Tag extends keyof JSX.IntrinsicElements>(Tag: Tag) {
  return React.forwardRef<HTMLElement, MotionProps<Tag>>(function MotionComponent(
    { initial, animate, transition, style, ...rest }: MotionProps<Tag>,
    ref
  ) {
    const localRef = useRef<HTMLElement | null>(null);
    const mergedRef = useMergeRefs(ref, localRef);
    const initialStyle = useMemo(() => ({ ...initial, ...style }), [initial, style]);

    useEffect(() => {
      const node = localRef.current;
      if (!node || !animate) return;
      const keyframes = [initial ?? {}, animate];
      const options: KeyframeAnimationOptions = {
        duration: (transition?.duration ?? 0.45) * 1000,
        easing: transition?.ease ?? "ease-out",
        fill: "forwards",
      };
      if (typeof node.animate === "function") {
        node.animate(keyframes, options);
      } else {
        Object.assign(node.style, animate);
      }
    }, [animate, initial, transition]);

    return React.createElement(Tag, { ref: mergedRef, style: initialStyle, ...rest });
  });
}

const motion = {
  div: createMotionComponent("div"),
  section: createMotionComponent("section"),
};

export { motion };
