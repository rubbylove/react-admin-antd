// 登录页
import React from 'react'
import { Redirect } from 'react-router-dom'

class Login extends React.Component {
    state = {
        redirectToReferrer: false // 重定向到 来访地址
    }

    login = () => { // 此时已登录, 直接修改 state
        this.setState({
            redirectToReferrer: true
        })
    }

    render () {
        const { from } = this.props.location.state || { from: { pathname: '/' } }
        const { redirectToReferrer } = this.state

        if (redirectToReferrer) {
            return (
                <Redirect to={ from } />
            )
        }

        return (
            <div>
                <p>登录页: 若想访问 { from.pathname } ，你需要先登录</p>
                <button onClick={ this.login }>登录页: 登录</button>
            </div>
        )
    }
}

export default Login