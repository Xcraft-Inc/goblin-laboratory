import fontawesome from '@fortawesome/fontawesome';

// TODO: add support for free version (for the open-source version of westeros)
import faBicycle from '@fortawesome/fontawesome-pro-solid/faBicycle';
import faCalendarPlus from '@fortawesome/fontawesome-pro-solid/faCalendarPlus';
import faCar from '@fortawesome/fontawesome-pro-solid/faCar';
import faCaretDown from '@fortawesome/fontawesome-pro-solid/faCaretDown';
import faCube from '@fortawesome/fontawesome-pro-light/faCube';
import faFileAlt from '@fortawesome/fontawesome-pro-solid/faFileAlt';
import faFlask from '@fortawesome/fontawesome-pro-solid/faFlask';
import faLanguage from '@fortawesome/fontawesome-pro-solid/faLanguage';
import faMinus from '@fortawesome/fontawesome-pro-solid/faMinus';
import faPlus from '@fortawesome/fontawesome-pro-solid/faPlus';
import faRocket from '@fortawesome/fontawesome-pro-solid/faRocket';
import faSearch from '@fortawesome/fontawesome-pro-solid/faSearch';
import faSignInAlt from '@fortawesome/fontawesome-pro-solid/faSignInAlt';
import faSpinner from '@fortawesome/fontawesome-pro-solid/faSpinner';
import faTint from '@fortawesome/fontawesome-pro-solid/faTint';
import faTrain from '@fortawesome/fontawesome-pro-solid/faTrain';
import faTruck from '@fortawesome/fontawesome-pro-solid/faTruck';
import faTv from '@fortawesome/fontawesome-pro-solid/faTv';
import faUser from '@fortawesome/fontawesome-pro-solid/faUser';

function boot() {
  fontawesome.library.add(
    faBicycle,
    faCalendarPlus,
    faCar,
    faCaretDown,
    faCube,
    faFileAlt,
    faFlask,
    faLanguage,
    faMinus,
    faPlus,
    faRocket,
    faSearch,
    faSignInAlt,
    faSpinner,
    faTint,
    faTrain,
    faTruck,
    faTv,
    faUser
  );
}

export default boot;
