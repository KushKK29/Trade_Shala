import React, { useState, useEffect } from "react";
import { TrendingUpIcon, MailIcon, PhoneIcon, MapPinIcon } from "lucide-react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import emailjs from "emailjs-com";

const StockMarketContact = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    investmentInterest: "",
    agreed: false,
  });

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as
      | HTMLInputElement
      | HTMLTextAreaElement;

    // Use a type guard to check if the target is an HTMLInputElement
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.agreed) {
      alert("Please agree to the investment consultation terms.");
      return;
    }

    const templateParams = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      investmentInterest: formData.investmentInterest,
    };

    emailjs
      .send(
        "service_x98onwn",
        "template_7wbz7zl",
        templateParams,
        "rVCAY7OUljkJotEN1"
      )
      .then(
        (response) => {
          console.log(
            "Investment inquiry sent successfully!",
            response.status,
            response.text
          );
          alert("Thank you! Our financial advisor will contact you soon.");
        },
        (error) => {
          console.error("Failed to send investment inquiry.", error);
          alert("Oops! Something went wrong. Please try again.");
        }
      );

    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      investmentInterest: "",
      agreed: false,
    });
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-8">
            <TrendingUpIcon className="w-12 h-12 text-green-500 mr-4" />
            <h1 className="text-4xl font-bold text-white">
              Investment Consultation
            </h1>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Investment Inquiry Form */}
            <div
              className="bg-gray-800 p-8 rounded-lg shadow-2xl border-2 border-green-700"
              data-aos="fade-right"
            >
              <h2 className="text-2xl font-semibold text-green-400 mb-4">
                Schedule Your Consultation
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      First Name
                    </label>
                    <input
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full bg-gray-700 text-white border-2 border-gray-600 rounded-md p-2 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Last Name
                    </label>
                    <input
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full bg-gray-700 text-white border-2 border-gray-600 rounded-md p-2 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-gray-700 text-white border-2 border-gray-600 rounded-md p-2 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Investment Interests
                  </label>
                  <textarea
                    name="investmentInterest"
                    rows={4}
                    value={formData.investmentInterest}
                    onChange={handleChange}
                    placeholder="Describe your investment goals and preferences"
                    className="w-full bg-gray-700 text-white border-2 border-gray-600 rounded-md p-2 focus:border-green-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="agreed"
                    checked={formData.agreed}
                    onChange={handleChange}
                    className="size-[1rem] mr-2 text-green-500 focus:ring-green-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-400">
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      className="text-green-500 hover:underline"
                    >
                      consultation terms
                    </Link>
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition duration-300"
                >
                  Request Consultation
                </button>
              </form>
            </div>

            {/* Contact Details */}
            <div
              className="bg-gray-800 p-8 rounded-lg shadow-2xl border-2 border-green-700"
              data-aos="fade-left"
            >
              <h2 className="text-2xl font-semibold text-green-400 mb-6">
                Contact Information
              </h2>

              <div className="space-y-6">
                <div className="flex items-center">
                  <MailIcon className="w-6 h-6 text-green-500 mr-4" />
                  <div>
                    <h3 className="font-semibold text-white">Email</h3>
                    <p className="text-gray-400">investments@stockmarket.com</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <PhoneIcon className="w-6 h-6 text-green-500 mr-4" />
                  <div>
                    <h3 className="font-semibold text-white">Phone</h3>
                    <p className="text-gray-400">+91 823 456 7890</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <MapPinIcon className="w-6 h-6 text-green-500 mr-4" />
                  <div>
                    <h3 className="font-semibold text-white">Address</h3>
                    <p className="text-gray-400">
                      Investment Tower, Financial District, Hyderabad, India
                      500032
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  Market Hours
                </h3>
                <p className="text-gray-300">
                  Mon-Fri: 9:00 AM - 6:00 PM IST
                  <br />
                  Weekend: Closed for trading
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockMarketContact;
