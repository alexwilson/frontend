import Logo from './logo'

const Organization = () => ({
  '@type': 'Organization',
  '@context': 'http://schema.org',
  'name': 'Alex Wilson',
  'logo': Logo(),
  'url':'https://alexwilson.tech',
  'sameAs':[
    'https://www.twitter.com/AlexWilsonV1',
    'https://www.linkedin.com/in/alex-',
    'https://github.com/alexwilson'
  ]
})

export default Organization
