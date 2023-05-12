import { useCallback, useContext } from 'react';

const useFetch = () => {
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
    }
  );

  return { fetchData };
};

export default useFetch;