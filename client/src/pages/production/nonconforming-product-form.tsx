import React from "react";
import { Helmet } from "react-helmet";
import { NonconformingProductForm } from "@/components/production/nonconforming-product-form";

const NonconformingProductFormPage = () => {
  return (
    <>
      <Helmet>
        <title>Record Nonconforming Product | eQMS</title>
        <meta name="description" content="Record a nonconforming product in the quality management system" />
      </Helmet>
      
      <NonconformingProductForm />
    </>
  );
};

export default NonconformingProductFormPage;