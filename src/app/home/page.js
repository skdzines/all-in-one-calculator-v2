"use client"

import { Provider } from 'react-redux';
import store from '../store';
import Main from '../components/main';
import styles from "./page.module.css";

export default function Home() {
  return (
    <Provider store={ store }>
      <Main />
    </Provider>
  );
}
