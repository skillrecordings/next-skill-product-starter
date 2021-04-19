import * as React from 'react'
import {FunctionComponent} from 'react'
import DevBundles from '../../data/bundles.development.json'
import ProdBundles from '../../data/bundles.production.json'
import Commerce from '../components/commerce'
import {SellableResource} from '@types'
import Layout from 'layouts'

type BuyProps = {
  bundles: SellableResource[]
}

const Buy: FunctionComponent<BuyProps> = ({bundles}) => {
  return (
    <Layout meta={{title: 'Get My Product'}}>
      <Commerce bundles={bundles} />
    </Layout>
  )
}

export async function getStaticProps() {
  const bundles =
    process.env.NODE_ENV === 'production' ? ProdBundles : DevBundles
  return {
    props: {bundles},
  }
}

export default Buy
