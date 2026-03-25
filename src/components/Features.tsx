"use client";

import FeatureCard from './FeatureCard'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const FeaturesContent = () => {
  const searchParams = useSearchParams()
  const ip = searchParams.get('ip')

  const getFullHref = (href: string) => {
    if (!ip) return href
    const url = new URL(href, "http://dummy.com")
    url.searchParams.set('ip', ip)
    return url.pathname + url.search
  }

  const features = [
    {
      title: "Message Configuration",
      description: "Dynamically configure containers via targeted message payload",
      demoLink: getFullHref("/message")
    },
    {
      title: "About & Documentation",
      description: "Learn more about the project, licensing, and usage prerequisites.",
      demoLink: getFullHref("/about")
    }
  ]

  return (
    <section className="w-full pb-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              demoLink={feature.demoLink}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

const Features = () => {
  return (
    <Suspense fallback={<div className="h-40 flex items-center justify-center text-neutral-500">加载特性中...</div>}>
      <FeaturesContent />
    </Suspense>
  )
}

export default Features;