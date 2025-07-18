import React from "react";
import styles from "../../styles/loading/loading.module.css";
const Loading = () => {
  return (
    <div className="w-full h-dvh fixed top-0 left-0 z-50 background_color flex justify-center items-center">
      <div className="flex flex-col gap-y-5">
        <div className={styles.loading_bar} >
          Loading
        </div>
      </div>
    </div>
  );
};

export default Loading;
