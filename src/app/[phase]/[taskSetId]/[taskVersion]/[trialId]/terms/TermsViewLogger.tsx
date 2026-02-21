"use client";

import { useEffect, useRef } from "react";

type Props = {
  logView: () => Promise<void>;
};

export default function TermsViewLogger({ logView }: Props) {
  const onceRef = useRef(false);

  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;
    void logView();
  }, [logView]);

  return null;
}
