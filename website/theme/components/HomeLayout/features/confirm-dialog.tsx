import { useI18n } from '@rspress/core/runtime';
import { useState } from 'react';

import type { ToiProps } from '@praha/toi';
import type I18nJson from 'i18n';
import type { FC } from 'react';

export const ConfirmDialog: FC<ToiProps<boolean>> = ({
  ref,
  resolve,
}) => {
  const t = useI18n<typeof I18nJson>();
  const [closing, setClosing] = useState(false);

  const handleClose = (value: boolean) => {
    setClosing(true);
    resolve(value);
  };

  return (
    <div ref={ref} className={closing ? 'home-toi-demo__scrim home-toi-demo__scrim--closing' : 'home-toi-demo__scrim'}>
      <div className={closing ? 'home-toi-demo__dialog home-toi-demo__dialog--closing' : 'home-toi-demo__dialog'}>
        <p className="home-toi-demo__question">{t('home.features.01.question')}</p>
        <div className="home-toi-demo__actions">
          <button type="button" className="home-toi-demo__button home-toi-demo__button--primary" disabled={closing} onClick={() => handleClose(true)}>
            {t('home.features.01.ok')}
          </button>
          <button type="button" className="home-toi-demo__button" disabled={closing} onClick={() => handleClose(false)}>
            {t('home.features.01.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};
