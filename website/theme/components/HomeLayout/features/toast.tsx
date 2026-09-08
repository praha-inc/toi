import { useI18n } from '@rspress/core/runtime';
import { useState } from 'react';

import type { ToiProps } from '@praha/toi';
import type I18nJson from 'i18n';
import type { FC } from 'react';

export const Toast: FC<ToiProps> = ({
  ref,
  resolve,
}) => {
  const t = useI18n<typeof I18nJson>();
  const [closing, setClosing] = useState(false);

  const handleDismiss = () => {
    setClosing(true);
    resolve();
  };

  return (
    <div ref={ref} className={closing ? 'home-toi-demo__toast home-toi-demo__toast--closing' : 'home-toi-demo__toast'}>
      <p>{t('home.features.03.message')}</p>
      <button type="button" className="home-toi-demo__button" disabled={closing} onClick={handleDismiss}>
        {t('home.features.03.dismiss')}
      </button>
    </div>
  );
};
