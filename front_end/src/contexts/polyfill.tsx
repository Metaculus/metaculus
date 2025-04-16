"use client";
import "@/polyfills";
import { FC, PropsWithChildren } from "react";

/**
 * Not an actual Context provider. It's a simple wrapper that enables polyfills on the client
 */
const PolyfillProvider: FC<PropsWithChildren> = ({ children }) => children;

export default PolyfillProvider;
