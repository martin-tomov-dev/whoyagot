import { useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const useFetch = () => {
  //const { authState } = useContext(AuthContext);

  const fetchData = useCallback(
    async (props) => {
      let requestOptions;
      if (props.requestOptions) {
        requestOptions = props.requestOptions;
      } else {
        requestOptions = {
          method: props.method,
          headers: { 'Content-Type': 'application/json' },
        };

        // if (authState.token) {
        //   requestOptions.headers.token = authState.token;
        // }

        if (props.method === 'POST') {
          requestOptions.body = JSON.stringify(props.body);
        }
      }

      return fetch(props.url, requestOptions)
        .then((res) => {
          return res.json();
        })
        .catch((error) => {
          console.log(error);
        });
    }//,
    //[authState]
  );

  return { fetchData };
};

export default useFetch;