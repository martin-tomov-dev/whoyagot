import axios from "axios";
//import { logout, useAuthDispatch, useAuthState } from "../context/authContext";

export function useAxios() {
  //const { token } = useAuthState();
  //const dispatch = useAuthDispatch();
  
  
  //axios.defaults.baseURL = 'http://localhost:3000';
  axios.defaults.baseURL = 'https://splitaction-01.azurewebsites.net:443';
  
  //axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
  axios.defaults.headers.post["Content-Type"] =
    "application/x-www-form-urlencoded";
  axios.interceptors.request.use((request) => {
    // if (token) {
    //   request.headers.common["Authorization"] = `Bearer ${token}`;
    // }

    request.timeout = 3600000;

    return request;
  });

  axios.interceptors.response.use(
    (response) => {
      return Promise.resolve(response);
    },
    (error) => {
      console.log("Axios Response Issue");
      console.log(error);
      const { status } = error.response;

      // if (status === 401) {
      //   logout(dispatch);
      // }

      return Promise.reject(error);
    }
  );
}
