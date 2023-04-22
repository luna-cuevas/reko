import React, { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../lib/supabaseClient";
import { useStateContext } from "../context/StateContext";
import { Session } from "@supabase/supabase-js";
import { useRouter } from "next/router";

const login = () => {
  const { state, setState } = useStateContext();
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN") {
          // Redirect to the homepage when the user logs in
          router.push("/");
        }
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  return <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />;
};

export default login;
