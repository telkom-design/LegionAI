import React, { useState } from 'react';

interface Template {
  id: string;
  title: string;
  category: string;
  image: string;
  description?: string;
  badge?: string;
  link?: string;
}

const templates: Template[] = [
  {
    id: '1',
    title: 'Login Username as Primary Key',
    description: 'Login & Register Templates',
    image: '/starterkits/login-signup.png',
    badge: 'Legion',
    category: '',
    link: 'https://legion-pattern-login-register.vercel.app/login/username',
  },
  {
    id: '2',
    title: 'Landing Page SAAS Application',
    description: 'Landing Page Templates',
    image: '/starterkits/landing-saas.png',
    badge: 'Bigbox',
    category: '',
    link: 'https://legion-pattern-login-register.vercel.app/login/username',
  },
  {
    id: '3',
    title: 'Sales Monitoring Dashboard',
    description: 'Dashboard Templates',
    image: '/starterkits/sales-dashboard.png',
    badge: 'Legion',
    category: '',
    link: 'https://legion-pattern-dashboard-telkom-design.vercel.app/dashboard/sales-monitoring',
  },
  {
    id: '4',
    title: 'Landing Page B2B Solution',
    description: 'Landing Page Templates',
    image: '/starterkits/landing-b2b.png',
    category: '',
    link: 'https://legion-pattern-login-register.vercel.app/login/username',
    badge: 'MyTens',
  },
  {
    id: '5',
    title: 'Website Analytic Dashboard',
    description: 'Dashboard Templates',
    image: '/starterkits/analytic-dashboard.png',
    category: '',
    link: 'https://legion-pattern-login-register.vercel.app/login/username',
    badge: 'Legion',
  },
  {
    id: '6',
    title: 'Landing Page School Application',
    description: 'Landing Page Templates',
    image: '/starterkits/landing-school.png',
    category: '',
    link: 'https://legion-pattern-login-register.vercel.app/login/username',
    badge: 'Pijar Sekolah',
  },
];

const Header: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="mb-12 text-center sm:text-left">
    <h1 className="text-[20px] font-bold text-[#525252] mb-2">{title}</h1>
    <p className="text-[16px] text-[#525252] max-w-3xl">{description}</p>
  </div>
);

const TemplateCard: React.FC<{ template: Template }> = ({ template }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a href={template.link}>
      <div
        className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full transform"
        style={{
          transform: isHovered ? 'translateY(-5px)' : 'none',
          transition: 'transform 0.3s ease-in-out',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <img src={template.image} alt={template.title} className="w-full h-[225px] object-cover object-center" />
          {template.badge && (
            <div className="absolute bottom-3 left-3 bg-[#212121] text-white text-sm px-3 py-1 rounded-full">
              {template.badge}
            </div>
          )}
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{template.title}</h3>
          {template.description && <p className="text-gray-600 text-sm flex-grow">{template.description}</p>}
          <p className="text-sm text-indigo-600 mb-3">{template.category}</p>
        </div>
      </div>
    </a>
  );
};

const TemplateGrid: React.FC<{ templates: Template[] }> = ({ templates }) => {
  const firstRowTemplates = templates.slice(0, 3);
  const secondRowTemplates = templates.slice(3);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {firstRowTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {secondRowTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
};

function StarterKits() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Header
          title="Templates & Starter Kits"
          description="Come check out all the amazing things built with Legion"
        />
        <TemplateGrid templates={templates} />
      </div>
    </div>
  );
}

export default StarterKits;